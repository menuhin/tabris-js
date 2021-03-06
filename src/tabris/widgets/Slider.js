import NativeObject from '../NativeObject';
import Widget from '../Widget';

export default class Slider extends Widget {

  get _nativeType() {
    return 'tabris.Slider';
  }

}

NativeObject.defineProperties(Slider.prototype, {
  minimum: {type: 'integer', default: 0},
  maximum: {type: 'integer', default: 100},
  selection: {type: 'integer', nocache: true},
  tintColor: {type: 'ColorValue'}
});

NativeObject.defineEvents(Slider.prototype, {
  select: {native: true, changes: 'selection'}
});
