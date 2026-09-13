import { Component } from "@angular/core";

import {
  FIELD_HOST,
  FIELD_STYLES,
  FIELD_TEMPLATE,
  FieldBase,
} from "@/components/fields/field-base";
import { causticsField } from "@/components/fields/caustics/meta";
import { ShaderBackground } from "@/components/orbs/shader-background";

export { meta, causticsField } from "@/components/fields/caustics/meta";

/** `<field-caustics>`: fills its positioned parent. Give the host a position and height to use it as a block. */
@Component({
  selector: "field-caustics",
  imports: [ShaderBackground],
  template: FIELD_TEMPLATE,
  styles: FIELD_STYLES,
  host: FIELD_HOST,
})
export class FieldCaustics extends FieldBase {
  override readonly variant = causticsField;
}
