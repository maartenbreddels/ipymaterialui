from ._version import version_info, __version__  # noqa: F401
from .Html import *  # noqa: F401, F403
from .generated import *  # noqa: F401, F403
from .generated_lab import *  # noqa: F401, F403


def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'jupyter-materialui',
        'require': 'jupyter-materialui/extension'
    }]
