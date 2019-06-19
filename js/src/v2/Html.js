import { ReactWidgetModel } from './generated/ReactWidget';
import { unpack_models } from '@jupyter-widgets/base';

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
}

HtmlModel.serializers = {
    ...ReactWidgetModel.serializers,
    children: { deserialize: unpack_models },
};
