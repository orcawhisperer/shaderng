import { Component } from "@angular/core";

import {
  FIELD_HOST,
  FIELD_STYLES,
  FIELD_TEMPLATE,
  FieldBase,
} from "@/components/fields/field-base";
import { paintField } from "@/components/fields/paint/meta";
import { ShaderBackground } from "@/components/orbs/shader-background";

export { meta, paintField } from "@/components/fields/paint/meta";

/** `<field-paint>`: fills its positioned parent. Give the host a position and height to use it as a block. */
@Component({
  selector: "field-paint",
  imports: [ShaderBackground],
  template: FIELD_TEMPLATE,
  styles: FIELD_STYLES,
  host: FIELD_HOST,
})
export class FieldPaint extends FieldBase {
  override readonly variant = paintField;
}
