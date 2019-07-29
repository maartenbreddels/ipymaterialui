import os
import shutil
import subprocess
import fileinput
import json
from .generate_schema import generate_schema

here = os.path.dirname(os.path.abspath(__file__))
base_schema = f'{here}/base.json'
build_dir = f'{here}/build'
materialui_core_api = f'{build_dir}/core_api.json'
materialui_lab_api = f'{build_dir}/lab_api.json'
widget_gen_schema = f'{build_dir}/widget_gen_schema.json'
widget_gen_lab_schema = f'{build_dir}/widget_gen_lab_schema.json'

widgetgen = f'{here}/node_modules/.bin/widgetgen'

es6_template = f'{here}/es6-template.njk'
es6_lab_template = f'{here}/es6-lab-template.njk'
python_template = f'{here}/python.njk'
python_lab_template = f'{here}/python_lab.njk'

project_dir = f'{here}/..'
destination_js = f'{project_dir}/js/src/generated'
destination_lab_js = f'{project_dir}/js/src/generated_lab'
destination_python = f'{project_dir}/ipymaterialui/generated'
destination_lab_python = f'{project_dir}/ipymaterialui/generated_lab'


def reset_dir(name):
    if os.path.isdir(name):
        shutil.rmtree(name)

    os.mkdir(name)


def generate_materialui_api():
    subprocess.check_call(f'npm install --package-lock-only', cwd=f'{here}/../js', shell=True)

    src = f'{build_dir}/material-ui'
    package = json.loads(open(f'{here}/../js/package-lock.json').read())
    version = package['dependencies']['@material-ui/core']['version'].replace('^', '')

    if not os.path.isdir(src):
        subprocess.check_call(
            f'git clone https://github.com/mui-org/material-ui.git {src}',
            shell=True)

    for cmd in ['git reset --hard HEAD',
                'git fetch',
                f'git checkout tags/v{version}',
                f'{here}/node_modules/.bin/yarn']:
        subprocess.check_call(cmd, cwd=src, shell=True)

    shutil.copy2(f'{here}/buildApiJson.js', f'{src}/docs/scripts/')

    script_name = 'gen_api_json'

    for line in fileinput.input(f'{src}/package.json', inplace=1):
        cmd = 'cross-env BABEL_ENV=test babel-node ./docs/scripts/buildApiJson.js'
        marker = '"scripts": {'
        if marker in line:
            print(f'{marker}\n    "{script_name}": "'
                  f'{cmd} ./packages/material-ui/src {materialui_core_api} && '
                  f'{cmd} ./packages/material-ui-lab/src {materialui_lab_api}",')
        else:
            print(line, end='')

    subprocess.check_call(f'npm run {script_name}', cwd=src, shell=True)


def generate():
    if not os.path.isdir(build_dir):
        os.mkdir(build_dir)

    subprocess.check_call('npm install', cwd=here, shell=True)

    generate_materialui_api()

    generate_schema(materialui_core_api, base_schema, widget_gen_schema)
    generate_schema(materialui_lab_api, None, widget_gen_lab_schema)

    reset_dir(destination_js)
    subprocess.check_call(
        f'{widgetgen} -p json -o {destination_js} -t {es6_template} {widget_gen_schema} es6',
        shell=True)

    reset_dir(destination_lab_js)
    subprocess.check_call(
        (f'{widgetgen} -p json -o {destination_lab_js} -t {es6_lab_template} '
         f'{widget_gen_lab_schema} es6'),
        shell=True)

    def create_eslintrc(dir):
        with open(f'{dir}/.eslintrc.js', 'w') as f:
            f.write('module.exports = {\n'
                    '   rules: {\n'
                    "       camelcase: 'off',\n"
                    "       quotes: 'off'\n"
                    '   },\n'
                    '};\n')

    create_eslintrc(destination_js)
    create_eslintrc(destination_lab_js)

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
