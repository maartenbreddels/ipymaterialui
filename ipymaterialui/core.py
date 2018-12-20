import ipywidgets as widgets
from traitlets import Unicode, Instance, CBool, CInt, HasTraits, Any, Dict
from ipywidgets.widgets.widget import widget_serialization
from ipywidgets.widgets.trait_types import TypedTuple
# from ipywidgets.widgets.trait_types import InstanceString, TypedTuple
from .mixins import ClickMixin

@widgets.register
class ReactWidget(widgets.DOMWidget, ClickMixin):
    """An example widget."""
    _view_name = Unicode('ReactView').tag(sync=True)
    _model_name = Unicode('ReactModel').tag(sync=True)
    _view_module = Unicode('jupyter-materialui').tag(sync=True)
    _model_module = Unicode('jupyter-materialui').tag(sync=True)
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    _model_module_version = Unicode('^0.1.0').tag(sync=True)
    child = Instance('ipywidgets.widgets.domwidget.DOMWidget', default_value=None, allow_none=True).tag(sync=True, **widget_serialization).tag(sync=True)
    children = TypedTuple(trait=Instance('ipywidgets.widgets.domwidget.DOMWidget'), help="children", default=[], allow_none=True).tag(sync=True, **widget_serialization).tag(sync=True)
    visible = CBool(True).tag(sync=True)
    content = Unicode(help="").tag(sync=True)
    style = Dict().tag(sync=True)
    # icon = Instance(widgets.DOMWidget, allow_none=True, default_value=None).tag(sync=True, **widget_serialization)

class Div(ReactWidget):
    _model_name = Unicode('DivModel').tag(sync=True)

def text(text):
    return Div(content=text)

def div(*children):
    if len(children) == 1:
        return Div(child=children[0])
    else:
        return Div(children=children)

def divjslink(widget, property):
    value = getattr(widget, property)
    issequence = False
    try:
        value[0]
        issequence = False
    except:
        pass
    div = Div()
    if issequence:
        widgets.jslink((widget, property), (div, 'children'))
    else:
        widgets.jslink((widget, property), (div, 'child'))
    return div

class Selectable:
    selected = CBool(help="selected or not").tag(sync=True)

class Checkable:
    checked = CBool(help="checked or not").tag(sync=True)

class ValueMixin(HasTraits):
    value = Any(help="value of the widget").tag(sync=True, **widget_serialization)

class LabelMixin:
    label = Unicode(help="value of the widget").tag(sync=True)

class Tabs(ReactWidget, ValueMixin):
    _model_name = Unicode('TabsModel').tag(sync=True)
    index = CInt(None, allow_none=True).tag(sync=True)
    scrollable = CBool(False).tag(sync=True)

class Tab(ReactWidget, ValueMixin):
    _model_name = Unicode('TabModel').tag(sync=True)
    label = Unicode(help="value of the widget").tag(sync=True)

class ButtonBase(ReactWidget, ClickMixin):
    description = Unicode(help="Button label.").tag(sync=True)

# class IconButton(ButtonBase):
#     _model_name = Unicode('IconButtonModel').tag(sync=True)
#     # icon = InstanceString(Icon, Icon.fontawesome, default_value=None, allow_none=True, help= "Button icon.").tag(sync=True, **widget_serialization)
#     icon = Instance(widgets.DOMWidget).tag(sync=True, **widget_serialization)

class Button(ButtonBase):
    _model_name = Unicode('ButtonModel').tag(sync=True)

class Checkbox(ReactWidget):#, Checkable, Value):
    _model_name = Unicode('CheckboxModel').tag(sync=True)
    description = Unicode(help="Menu item").tag(sync=True)
    selected = CBool(help="selected or not").tag(sync=True)
    checked = CBool(help="checked or not").tag(sync=True)
    icon = Instance('ipymaterialui.core.Icon', allow_none=True).tag(sync=True, **widget_serialization)
    checked_icon = Instance('ipymaterialui.core.Icon', allow_none=True).tag(sync=True, **widget_serialization)

class ToggleButton(ButtonBase, ValueMixin):
    _model_name = Unicode('ToggleButtonModel').tag(sync=True)
    selected = CBool(None, allow_none=True, help="selected or not").tag(sync=True)

class ToggleButtonGroup(ReactWidget, ValueMixin):
    _model_name = Unicode('ToggleButtonGroupModel').tag(sync=True)
    exclusive = CBool(False).tag(sync=True)

class Switch(ButtonBase, ValueMixin):
    _model_name = Unicode('SwitchModel').tag(sync=True)
    checked = CBool(None, allow_none=True, help="checked or not").tag(sync=True)

class ClickWidget(ReactWidget, ClickMixin):
    click_event_stop_capture = CBool(False).tag(sync=True)
    click_event_stop_bubble = CBool(False).tag(sync=True)

class ListItem(ClickWidget):
    _model_name = Unicode('ListItemModel').tag(sync=True)
    button = CBool(help="button or not").tag(sync=True)
    selected = CBool(help="selected or not").tag(sync=True)  # if removed, traitlets goes to inf recursion
    menu = Instance('ipymaterialui.core.Menu', allow_none=True).tag(sync=True, **widget_serialization)
    divider = CBool().tag(sync=True)
    description = Unicode(help="Menu item").tag(sync=True)
    click_fix = CBool(False).tag(sync=True)

class ListItemText(ReactWidget):
    _model_name = Unicode('ListItemTextModel').tag(sync=True)
    button = CBool(help="button or not").tag(sync=True)
    primary = Unicode().tag(sync=True)#Instance(widgets.DOMWidget, allow_none=True, default_value=None).tag(sync=True, **widget_serialization)
    secondary = Unicode().tag(sync=True)#Instance(widgets.DOMWidget, allow_none=True, default_value=None).tag(sync=True, **widget_serialization)

class List(ReactWidget):
    _model_name = Unicode('ListModel').tag(sync=True)

class MenuItem(ListItem, Selectable, ValueMixin):
    _model_name = Unicode('MenuItemModel').tag(sync=True)
    description = Unicode(help="Menu item").tag(sync=True)
    selected = CBool(help="selected or not").tag(sync=True)  # if removed, traitlets goes to inf recursion
    click_fix = CBool(False).tag(sync=True) # remove

class Menu(ReactWidget):
    _model_name = Unicode('MenuModel').tag(sync=True)
    description = Unicode(help="Menu item").tag(sync=True)
    items = TypedTuple(trait=Instance(MenuItem), help="Menu items", default=[], allow_none=True).tag(sync=True, **widget_serialization).tag(sync=True)

class Select(ReactWidget, ValueMixin):
    _model_name = Unicode('SelectModel').tag(sync=True)
    description = Unicode(help="Menu item").tag(sync=True)
    auto_width = CBool(False).tag(sync=True)
    multiple = CBool(False).tag(sync=True)
    # value = Unicode(None, allow_none=True).tag(sync=True)


class Chip(ReactWidget):
    _model_name = Unicode('ChipModel').tag(sync=True)
    label = Unicode(None, allow_none=True).tag(sync=True)

class FormControl(ReactWidget):
    _model_name = Unicode('FormControlModel').tag(sync=True)

class InputLabel(ReactWidget):
    _model_name = Unicode('InputLabelModel').tag(sync=True)
    description = Unicode(help="Jupyter Widgets Material UI").tag(sync=True)

class Icon(ReactWidget):
    _model_name = Unicode('IconModel').tag(sync=True)
    name = Unicode('circle').tag(sync=True)
    type = Unicode('filled').tag(sync=True)

# class SvgIcon(ReactWidget):
#     _model_name = Unicode('SvgIconModel').tag(sync=True)

class FormControlLabel(ReactWidget):#, Checkable, Value):
    _model_name = Unicode('FormControlLabelModel').tag(sync=True)
    label = Unicode(help="Label").tag(sync=True)
    control = Instance('ipymaterialui.core.ReactWidget', allow_none=True).tag(sync=True, **widget_serialization)

class TextField(ReactWidget, ValueMixin):
    _model_name = Unicode('TextFieldModel').tag(sync=True)
    helper_text = Instance('ipymaterialui.core.ReactWidget', allow_none=True).tag(sync=True, **widget_serialization)
    label = Unicode('label').tag(sync=True)
    multiline = CBool(False).tag(sync=True)
    placeholder = Unicode('placeholder').tag(sync=True)
    required = CBool(False).tag(sync=True)
    rows = CInt(None, allow_none=True).tag(sync=True)
    rowsMax = CInt(None, allow_none=True).tag(sync=True)
    variant = Unicode('standard').tag(sync=True)
