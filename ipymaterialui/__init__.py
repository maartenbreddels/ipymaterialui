from ._version import version_info, __version__

from .core import *

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'jupyter-materialui',
        'require': 'jupyter-materialui/extension'
    }]
