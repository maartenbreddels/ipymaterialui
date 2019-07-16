import json
import re

keywords = ['in', 'open']


def identity(x):
    return x


def find_component_json(name):
    if name not in mapped_by_name_json.keys():
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

    result = re.sub('(?!^)([A-Z]+)', r'_\1', name).lower()
    if name[0].isupper():
        result = result.capitalize()

    return result


def make_type(type_content):
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
    if type_ == 'custom' and 'raw' in type_content.keys():
        raw = type_content['raw']
        if raw == 'unsupportedProp':
            return None
        if raw.startswith('chainPropTypes(PropTypes.string'):
            type_ = 'string'
        if raw.startswith('chainPropTypes(PropTypes.bool'):
            type_ = 'boolean'
        if raw.startswith('chainPropTypes(PropTypes.number'):
            type_ = 'float'
        if raw.startswith('chainPropTypes(PropTypes.node'):
            type_ = 'node'

    if type_ in ['string', 'float', 'object', 'boolean']:
        return {
            'type': type_,
            'allowNull': True,
            'default': None
        }

    if type_ == 'array':
        return {
            'type': 'array',
            'items': {
                'type': 'any'
            },
            'allowNull': True,
            'default': None
        }

    if type_ == 'arrayOf':
        array_type = 'float' if type_content['value']['name'] == 'number' else 'any'
        return {
            'type': 'array',
            'items': {
                'type': array_type
            },
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
            }, {
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

    if name == 'anchorEl':
        type_ = {
            'type': 'widgetRef',
            'widgetType': 'DOMWidget',
            'allowNull': True,
            'default': None
        }
    else:
        type_ = make_type(content['type'])

    if type_ is None:
        return None
    return property_to_snake_case(name), type_


def get_props_of_widget(widget_data):
    parent = widget_data['inheritance'] and widget_data['inheritance']['component']

    if widget_data['name'] == 'MenuItem':
        widget_data['props']['value'] = {'type': {'name': 'any'}}

    props = [make_prop(prop) for prop in widget_data['props'].items()]
    props = list(filter(identity, props))

    if parent:
        prop_names = [name for (name, _) in props]
        ancestor_props = get_props_of_widget(find_component_json(parent))
        distinct_ancestor_props = list(filter(
            lambda prop: prop[0] not in prop_names,
            ancestor_props))
        return props + distinct_ancestor_props
    else:
        return props


def make_widget(widget_data):
    props = get_props_of_widget(widget_data)

    return (widget_data['name'], {
        'inherits': ['ReactWidget'],
        'properties': dict(props)})


def generate_schema(materialui_api_file_name, base_schema_file_name, schema_output_file_name):
    global mapped_by_name_json

    api_data = json.loads(open(materialui_api_file_name).read())
    base_schema = json.loads(open(base_schema_file_name).read()) if base_schema_file_name \
        else {'widgets': {}}

    mapped_by_name_json = dict([(comp['name'], comp) for comp in api_data])

    widgets = filter(identity, map(make_widget, api_data))

    schema = {'widgets': {**base_schema['widgets'], **dict(widgets)}}

    with open(schema_output_file_name, 'w') as outfile:
        json.dump(schema, outfile)
