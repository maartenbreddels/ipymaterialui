ipymaterialui
===============================

Jupyter Widgets based on [Material-UI](https://material-ui.com/) which implement Google's 
[Material Design Spec](https://material.io/) with [React](https://reactjs.org/).

Installation
------------

Prerequisites:
    https://ipywidgets.readthedocs.io/en/stable/user_install.html

To install use pip:

    $ pip install ipymaterialui
    $ jupyter labextension install jupyter-materialui             # for lab


For a development installation (requires npm),

    $ git clone https://github.com/maartenbreddels/ipymaterialui.git
    $ cd ipymaterialui
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --sys-prefix ipymaterialui
    $ jupyter nbextension enable --py --sys-prefix ipymaterialui
    $ jupyter labextension install ./js

Usage
-----

For examples see the [example notebook](Core%20examples.ipynb).

The [Material-UI documentation](https://material-ui.com/components/buttons/) can be used to find all available 
components and attributes (on the left side bar). Click the <> icon to see the source code of the examples. Scroll to 
the bottom of the page to access a link to the API of the component. Ipymaterialui tries to stay close to the React and 
Material-UI API, but the syntax is different:

|   | Description | Material-UI | ipymaterialui |
|---|-------------|-------------|---------------|
|1| Components are classes instead of HTML | `<Button .../>` | `Button(...)` |
|2| Child components and text are defined in the children traitlet| `<Button>text <Icon .../></Button>` | `Button(children=['text', Icon(...)])` |
|3| Flag attributes require a boolean value | `<Container fixed ...` | `Container(fixed=True ...` |
|4| Attributes are snake_case | `<Button fullWidth ..` | `Button(full_width=True ...` |
|5| No onChange handler necessary, use [observe](https://traitlets.readthedocs.io/en/stable/using_traitlets.html#observe). Note that the main value is not always `value` like in ipywidgets (e.g. checked or selected) | `<Switch onChange="..."` | `mySwitch.checked` |
|6| Event listeners are defined with on_event | `<Button onClick={someMethod}' ...` | `button.on_event('onClick', some_method)` |
| | | | `def some_method(widget, event, data):` |
|7| Regular HTML tags can made with the Html class | `<div>...</div>` | `Html(tag='div', children=[...])` |
|8| The attributes class and style need to be suffixed with an underscore | `<Button class="mr-3" style="..." >` | `Button(class_='mr-3', style_={...})` |
|9| Icon uses the lowercase name from [Material icons](https://material.io/tools/icons/?style=baseline) | `<AlarmOnIcon .../>` | `Icon(children='alarm_on' ...)` |


Examples
--------

### Aspect 1, 2, 3, 4, 6, 8 and 9

This example demonstrates aspect 1, 2, 3, 4, 6, 8 and 9 of the table above. 

![materiaui-button](https://user-images.githubusercontent.com/46192475/61886271-aafb4c00-aeff-11e9-86cc-fd1e0d228e60.gif)

#### React/Material-UI 
```typescript jsx
const useStyles = makeStyles(theme => ({                      (8)
    alarmOnIcon: {
        marginRight: theme.spacing(1),
    },
}));

export default function MyButton() {
    const classes = useStyles();                              (8)
    const [btnText, setBtnText] = React.useState('Primary');  (6)

    function someMethod() {                                   (6)
        setBtnText(() => new Date().toLocaleTimeString());
    }

    return (
        (1)                                         (3)(4)      (6)          
        <Button variant="contained" color="primary" centerRipple onClick={someMethod}>
            (2)(9)       (8)
            <AlarmOnIcon className={classes.alarmOnIcon}/>
            {btnText}
        </Button>
    );
}
```


#### ipymaterialui
```python
import ipymaterialui as mui
import datetime
             (1)                                          (3)(4)              (2)
button = mui.Button(variant='contained', color='primary', center_ripple=True, children=[
             (8)                                      (9)
    mui.Icon(style_={'marginRight': '8px'}, children='alarm_on'),
    'Primary'
])

def some_method(widget, event, data):                 (6)
    time = datetime.datetime.now().strftime("%X")
    button.children = [button.children[0], time]

button.on_event('onClick', some_method)               (6)
button
```

### Aspect 5

This example demonstrates aspect 5 of the table above.

![materiaui-switch](https://user-images.githubusercontent.com/46192475/61886282-b0f12d00-aeff-11e9-91c5-060eabc7fb4f.gif)

#### React/Material-UI 
```typescript jsx
export default function MySwitch() {
    const [state, setState] = React.useState(true);

    const handleChange = event => {
        setState(event.target.checked);
    };
    
    return (
        <Switch
            checked={state}
            onChange={handleChange}
        />
    );
}
```

#### ipymaterialui
```python
import ipymaterialui as mui

mui.Switch(checked=True)
```

### Aspect 7

This example demonstrates aspect 7 of the table above.

#### React/Material-UI 
```typescript jsx
export default function MyHtml() {
    return (
        <div>some HTML</div>
    );
}
```

#### ipymaterialui
```python
import ipymaterialui as mui

mui.Html(tag='div', children='some HTML')
```
