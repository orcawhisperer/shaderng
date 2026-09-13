import { Component } from "@angular/core";

import {
  FIELD_HOST,
  FIELD_STYLES,
  FIELD_TEMPLATE,
  FieldBase,
} from "@/components/fields/field-base";
import { auroraField } from "@/components/fields/aurora/meta";
import { ShaderBackground } from "@/components/orbs/shader-background";

export { meta, auroraField } from "@/components/fields/aurora/meta";

/** `<field-aurora>`: fills its positioned parent. Give the host a position and height to use it as a block. */
@Component({
  selector: "field-aurora",
  imports: [ShaderBackground],
  template: FIELD_TEMPLATE,
  styles: FIELD_STYLES,
  host: FIELD_HOST,
})
export class FieldAurora extends FieldBase {
  override readonly variant = auroraField;
}
