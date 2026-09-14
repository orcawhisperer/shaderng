import { Component } from "@angular/core";

import {
  FIELD_HOST,
  FIELD_STYLES,
  FIELD_TEMPLATE,
  FieldBase,
} from "@/components/fields/field-base";
import { singularityField } from "@/components/fields/singularity/meta";
import { ShaderBackground } from "@/components/orbs/shader-background";

export { meta, singularityField } from "@/components/fields/singularity/meta";

/** `<field-singularity>`: fills its positioned parent. Give the host a position and height to use it as a block. */
@Component({
  selector: "field-singularity",
  imports: [ShaderBackground],
  template: FIELD_TEMPLATE,
  styles: FIELD_STYLES,
  host: FIELD_HOST,
})
export class FieldSingularity extends FieldBase {
  override readonly variant = singularityField;
}
