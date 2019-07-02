import json
import re
from itertools import chain

keywords = ['in', 'open']

def identity(x):
    return x

def find_component_json(name):
    if name not in mapped_by_name_json.keys():
        print(f'{name} not found')
        return {
            'name': name,
            'props': {},
            'inheritance': None
        }
    return mapped_by_name_json[name]

types = set()


def property_to_snake_case(name):
    if name.startswith('aria'):
        return name.replace('-', '_')

    return re.sub('(?!^)([A-Z]+)', r'_\1', name).lower()

def make_type(type_content, name='bla'):
    type_ = type_content['name']
    types.add(type_)

    if type_ == 'bool':
        type_ = 'boolean'
    if type_ == 'enum':
        type_ = 'any'
    if type_ == 'elementType':
        type_ = 'string'
    if type_ in ['shape']:
        type_ = 'object'
    if type_ == 'number':
        type_ = 'float'
    if type_ == 'custom' and 'raw' in type_content.keys() and type_content['raw'].startswith('chainPropTypes(PropTypes.node'):
        type_ = 'node'

    if type_ in ['string', 'float', 'object', 'boolean']:
        return {
            'type': type_,
            'allowNull': True,
            'default': None
        }
    
    if type_ == 'any':
        return {
            'type': 'union',
            'oneOf': [{
                'type': 'any'
            }, {
                'type': 'widgetRef',
                'widgetType': 'DOMWidget'
            },{
                'type': 'array',
                'items': {
                    'type': 'widgetRef',
                    'widgetType': 'DOMWidget'
                } 
            }],
            'allowNull': True,
            'default': None
        }

    if type_ == 'custom' and 'raw' in type_content.keys() and 'AcceptingRef' in type_content['raw']:
        print(f"- matched: {name} [{type_}, {'raw' in type_content.keys()}, {'AcceptingRef' in type_content['raw']}]")
        return {
            'type': 'widgetRef',
            'widgetType': 'DOMWidget',
            'allowNull': True,
            'default': None
        }

    text_or_widget = {
        'type': 'union',
        'default': None,
        'oneOf': [{
            'type': 'string'
        }, {
            'type': 'widgetRef',
            'widgetType': 'DOMWidget'
        }]
    }

    if type_ == 'node' or type_ == 'element':
        return {
            'type': 'union',
            'oneOf': [
                text_or_widget, {
                    'type': 'array',
                    'items': text_or_widget
                }
            ],
            'allowNull': True,
            'default': None
        }

    if type_ == 'union':
        return {'type': 'union',
                'default': None,
                'oneOf': list(filter(identity, map(make_type, type_content['value'])))}

    if type_ == 'func':
        # Not supported
        return None

    print(f'Skipping type {type_} for now. {type_content}')
    return None


def make_prop(prop_data):
    (name, content) = prop_data
    if name in keywords:
        name += '_'
    print(name)
    if name == 'anchorEl':
        type_ = {
            'type': 'widgetRef',
            'widgetType': 'DOMWidget',
            'allowNull': True,
            'default': None
        }
    else:
        type_ = make_type(content['type'], name)
    # if content['type']['name'] == 'elementType':
    #     print(f"{name}, {content['description']}")
    if type_ is None:
        return None
    return property_to_snake_case(name), type_

def get_props_of_widget(widget_data):
    parent = widget_data['inheritance'] and widget_data['inheritance']['component']
    # print(f"name: {widget_data['name']}, parent: {parent}")
    if widget_data['name'] == 'MenuItem':
        widget_data['props']['value'] = {'type': {'name': 'any'}}
        
    props = [make_prop(prop) for prop in widget_data['props'].items()]
    props = list(filter(identity, props))

    if parent:
        print(f"inherit: {parent}")
        propNames = [name for (name, _) in props]
        without_duplicates = list(filter(lambda prop: prop[0] not in propNames, get_props_of_widget(find_component_json(parent))))
        return props + without_duplicates
    else:
        return props

def make_widget(widget_data):
    print(f"name: {widget_data['name']}")
    # if widget_data['inheritance'] and widget_data['inheritance']['component']:
    #     return None
    parent = widget_data['inheritance'] and widget_data['inheritance']['component']
    # props = [make_prop(prop) for prop in data['props'].items()]

    props = get_props_of_widget(widget_data)
    #print((widget_data['name'], parent, props))

    return (widget_data['name'], {
        'inherits': ['ReactWidget'],
        'properties': dict(props)})

def generate_schema(materialui_api_file_name, base_schema_file_name, schema_output_file_name):
    global mapped_by_name_json

    api_data = json.loads(open(materialui_api_file_name).read())
    base_schema = json.loads(open(base_schema_file_name).read()) if base_schema_file_name else {'widgets': {}}

    mapped_by_name_json = dict([(comp['name'], comp) for comp in api_data])

    widgets = filter(identity, map(make_widget, api_data))

    schema = {'widgets': {**base_schema['widgets'], **dict(widgets)}}
    # schema = {'widgets': { **dict(widgets)}}
    print('types', types)

    with open(schema_output_file_name, 'w') as outfile:
        json.dump(schema, outfile)

# generate_schema('core_api.json', 'base.json', 'out.json')