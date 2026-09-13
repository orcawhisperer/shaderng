import { Component } from "@angular/core";

import {
  FIELD_HOST,
  FIELD_STYLES,
  FIELD_TEMPLATE,
  FieldBase,
} from "@/components/fields/field-base";
import { nebulaField } from "@/components/fields/nebula/meta";
import { ShaderBackground } from "@/components/orbs/shader-background";

export { meta, nebulaField } from "@/components/fields/nebula/meta";

/** `<field-nebula>`: fills its positioned parent. Give the host a position and height to use it as a block. */
@Component({
  selector: "field-nebula",
  imports: [ShaderBackground],
  template: FIELD_TEMPLATE,
  styles: FIELD_STYLES,
  host: FIELD_HOST,
})
export class FieldNebula extends FieldBase {
  override readonly variant = nebulaField;
}
