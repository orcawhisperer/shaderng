import { Component } from "@angular/core";

import {
  FIELD_HOST,
  FIELD_STYLES,
  FIELD_TEMPLATE,
  FieldBase,
} from "@/components/fields/field-base";
import { wavesField } from "@/components/fields/waves/meta";
import { ShaderBackground } from "@/components/orbs/shader-background";

export { meta, wavesField } from "@/components/fields/waves/meta";

/** `<field-waves>`: fills its positioned parent. Give the host a position and height to use it as a block. */
@Component({
  selector: "field-waves",
  imports: [ShaderBackground],
  template: FIELD_TEMPLATE,
  styles: FIELD_STYLES,
  host: FIELD_HOST,
})
export class FieldWaves extends FieldBase {
  override readonly variant = wavesField;
}
