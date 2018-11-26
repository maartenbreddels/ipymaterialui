import ipywidgets as widgets
from traitlets import Unicode, Instance, CBool
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
    children = TypedTuple(trait=Instance('ipymaterialui.core.ReactWidget'), help="children", default=[], allow_none=True).tag(sync=True, **widget_serialization).tag(sync=True)

class Selectable:
    selected = CBool(help="selected or not").tag(sync=True)

class Checkable:
    checked = CBool(help="checked or not").tag(sync=True)

class Value:
    value = Unicode(help="value of the widget").tag(sync=True)

# class Icon(ReactWidget):
#     _model_name = Unicode('IconModel').tag(sync=True)
#     name = Unicode('delete').tag(sync=True)
#     @classmethod
#     def fontawesome(cls, value):
#         return Icon()

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

class ToggleButton(ButtonBase):
    _model_name = Unicode('ToggleButtonModel').tag(sync=True)
    value = Unicode().tag(sync=True)
    # icon = Instance(widgets.DOMWidget, allow_none=True).tag(sync=True, **widget_serialization)
    selected = CBool(None, allow_none=True, help="selected or not").tag(sync=True)

class ToggleButtonGroup(ReactWidget):
    _model_name = Unicode('ToggleButtonGroupModel').tag(sync=True)
    # children = TypedTuple(trait=Instance(ToggleButton), help="Toggle buttons", default=[], allow_none=True).tag(sync=True, **widget_serialization).tag(sync=True)
    value = Unicode().tag(sync=True)
    exclusive = CBool(False).tag(sync=True)

class ListItem(ReactWidget):
    _model_name = Unicode('ListItemModel').tag(sync=True)
    button = CBool(help="button or not").tag(sync=True)
    selected = CBool(help="selected or not").tag(sync=True)  # if removed, traitlets goes to inf recursion
    menu = Instance('ipymaterialui.core.Menu', allow_none=True).tag(sync=True, **widget_serialization)
    divider = CBool().tag(sync=True)
    description = Unicode(help="Menu item").tag(sync=True)

class ListItemText(ReactWidget):
    _model_name = Unicode('ListItemTextModel').tag(sync=True)
    button = CBool(help="button or not").tag(sync=True)
    primary = Unicode().tag(sync=True)#Instance(widgets.DOMWidget, allow_none=True, default_value=None).tag(sync=True, **widget_serialization)
    secondary = Unicode().tag(sync=True)#Instance(widgets.DOMWidget, allow_none=True, default_value=None).tag(sync=True, **widget_serialization)

class List(ReactWidget):
    _model_name = Unicode('ListModel').tag(sync=True)

class SimpleListMenu(ReactWidget):
    _model_name = Unicode('SimpleListMenuModel').tag(sync=True)
    description = Unicode(help="Choose").tag(sync=True)
    description = Unicode(help="Simple List").tag(sync=True)
    items = TypedTuple(trait=Instance('ipymaterialui.core.MenuItem'), help="Menu items", default=[], allow_none=True).tag(sync=True, **widget_serialization)
    # list_item = Instance(ListItemText).tag(sync=True, **widget_serialization)


class MenuItem(ListItem, Selectable):
    _model_name = Unicode('MenuItemModel').tag(sync=True)
    description = Unicode(help="Menu item").tag(sync=True)
    selected = CBool(help="selected or not").tag(sync=True)  # if removed, traitlets goes to inf recursion
    value = Unicode(None, allow_none=True).tag(sync=True)

class Menu(ReactWidget):
    _model_name = Unicode('MenuModel').tag(sync=True)
    description = Unicode(help="Menu item").tag(sync=True)
    items = TypedTuple(trait=Instance(MenuItem), help="Menu items", default=[], allow_none=True).tag(sync=True, **widget_serialization).tag(sync=True)

class Select(ReactWidget):
    _model_name = Unicode('SelectModel').tag(sync=True)
    description = Unicode(help="Menu item").tag(sync=True)
    auto_width = CBool(False).tag(sync=True)
    multiple = CBool(False).tag(sync=True)
    value = Unicode(None, allow_none=True).tag(sync=True)


class Chip(ReactWidget):
    _model_name = Unicode('ChipModel').tag(sync=True)
    label = Unicode(None, allow_none=True).tag(sync=True)

class FormControl(ReactWidget):
    _model_name = Unicode('FormControlModel').tag(sync=True)

class InputLabel(ReactWidget):
    _model_name = Unicode('InputLabelModel').tag(sync=True)
    description = Unicode(help="Jupyter Widgets Material UI").tag(sync=True)

