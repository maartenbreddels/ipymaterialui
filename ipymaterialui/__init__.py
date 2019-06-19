from ._version import version_info, __version__

# from .core import *
from .v2.Html import Html
from .v2.generated import *
from .v2.generated_lab import *

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'jupyter-materialui',
        'require': 'jupyter-materialui/extension'
    }]
