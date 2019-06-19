import os
import shutil
import subprocess
from .generate_schema import generate_schema

here = os.path.dirname(os.path.abspath(__file__))
print(f'[here]')
materialui_core_api = f'{here}/core_api.json'
materialui_lab_api = f'{here}/lab_api.json'
base_schema = f'{here}/base.json'
build_dir = f'{here}/build'
widget_gen_schema = f'{build_dir}/widget_gen_schema.json'
widget_gen_lab_schema = f'{build_dir}/widget_gen_lab_schema.json'

widgetgen = f'{here}/node_modules/.bin/widgetgen'

es6_template = f'{here}/es6-template.njk'
es6_lab_template = f'{here}/es6-lab-template.njk'
python_template = f'{here}/python.njk'
python_lab_template = f'{here}/python_lab.njk'

project_dir = f'{here}/..'
destination_js = f'{project_dir}/js/src/v2/generated'
destination_lab_js = f'{project_dir}/js/src/v2/generated_lab'
destination_python = f'{project_dir}/ipymaterialui/v2/generated'
destination_lab_python = f'{project_dir}/ipymaterialui/v2/generated_lab'


def reset_dir(name):
    if os.path.isdir(name):
        shutil.rmtree(name)

    os.mkdir(name)


def generate():
    if not os.path.isdir(build_dir):
        os.mkdir(build_dir)

    generate_schema(materialui_core_api, base_schema, widget_gen_schema)
    generate_schema(materialui_lab_api, None, widget_gen_lab_schema)

    subprocess.check_call('npm install', cwd=here, shell=True)

    reset_dir(destination_js)
    subprocess.check_call(
        f'{widgetgen} -p json -o {destination_js} -t {es6_template} {widget_gen_schema} es6',
        shell=True)

    reset_dir(destination_lab_js)
    subprocess.check_call(
        f'{widgetgen} -p json -o {destination_lab_js} -t {es6_lab_template} {widget_gen_lab_schema} es6',
        shell=True)


    with open(f'{destination_js}/.eslintrc.js', 'w') as f:
        f.write('''
            module.exports = {
                rules: {
                    camelcase: 'off',
                    quotes: 'off'
                },
                "allowNull": True,
                "default": None
            };
        ''')

    reset_dir(destination_python)
    subprocess.check_call(
        f'{widgetgen} -p json -o {destination_python} -t {python_template} '
        f'{widget_gen_schema} python',
        shell=True)

    reset_dir(destination_lab_python)
    subprocess.check_call(
        f'{widgetgen} -p json -o {destination_lab_python} -t {python_lab_template} '
        f'{widget_gen_lab_schema} python',
        shell=True)


generate()
