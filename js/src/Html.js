import { unpack_models } from '@jupyter-widgets/base';
import { ReactWidgetModel } from './generated/ReactWidget';

export class HtmlModel extends ReactWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            ...{
                _model_name: 'HtmlModel',
                children: undefined,
                tag: null,
            },
        };
    }

    getReactComponent() {
        return this.get('tag');
    }
}

HtmlModel.serializers = {
    ...ReactWidgetModel.serializers,
    children: { deserialize: unpack_models },
};
