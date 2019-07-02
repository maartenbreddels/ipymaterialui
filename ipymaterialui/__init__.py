from ._version import version_info, __version__

from .Html import (Html, divjslink)
from .generated import *
from .generated_lab import *

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'jupyter-materialui',
        'require': 'jupyter-materialui/extension'
    }]
