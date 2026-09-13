import { Component } from "@angular/core";

import {
  FIELD_HOST,
  FIELD_STYLES,
  FIELD_TEMPLATE,
  FieldBase,
} from "@/components/fields/field-base";
import { gridField } from "@/components/fields/grid/meta";
import { ShaderBackground } from "@/components/orbs/shader-background";

export { meta, gridField } from "@/components/fields/grid/meta";

/** `<field-grid>`: fills its positioned parent. Give the host a position and height to use it as a block. */
@Component({
  selector: "field-grid",
  imports: [ShaderBackground],
  template: FIELD_TEMPLATE,
  styles: FIELD_STYLES,
  host: FIELD_HOST,
})
export class FieldGrid extends FieldBase {
  override readonly variant = gridField;
}
