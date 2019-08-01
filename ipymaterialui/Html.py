from traitlets import (Unicode, Instance, Union, List)
from .generated.ReactWidget import ReactWidget
from ipywidgets import DOMWidget
from ipywidgets.widgets.widget import widget_serialization


class Html(ReactWidget):

    _model_name = Unicode('HtmlModel').tag(sync=True)

    children = Union([
        Union([
            Unicode(),
            Instance(DOMWidget)
        ], default_value=None),
        List(Union([
            Unicode(),
            Instance(DOMWidget)
        ], default_value=None))
    ], default_value=None, allow_none=True).tag(sync=True, **widget_serialization)

    tag = Unicode(None, allow_none=True).tag(sync=True)


__all__ = ['Html']
