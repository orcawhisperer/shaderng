import { Component } from "@angular/core";

import {
  FIELD_HOST,
  FIELD_STYLES,
  FIELD_TEMPLATE,
  FieldBase,
} from "@/components/fields/field-base";
import { cyberField } from "@/components/fields/cyber/meta";
import { ShaderBackground } from "@/components/orbs/shader-background";

export { meta, cyberField } from "@/components/fields/cyber/meta";

/** `<field-cyber>`: fills its positioned parent. Give the host a position and height to use it as a block. */
@Component({
  selector: "field-cyber",
  imports: [ShaderBackground],
  template: FIELD_TEMPLATE,
  styles: FIELD_STYLES,
  host: FIELD_HOST,
})
export class FieldCyber extends FieldBase {
  override readonly variant = cyberField;
}
