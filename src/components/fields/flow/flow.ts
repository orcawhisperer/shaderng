import { Component } from "@angular/core";

import {
  FIELD_HOST,
  FIELD_STYLES,
  FIELD_TEMPLATE,
  FieldBase,
} from "@/components/fields/field-base";
import { flowField } from "@/components/fields/flow/meta";
import { ShaderBackground } from "@/components/orbs/shader-background";

export { meta, flowField } from "@/components/fields/flow/meta";

/** `<field-flow>`: fills its positioned parent. Give the host a position and height to use it as a block. */
@Component({
  selector: "field-flow",
  imports: [ShaderBackground],
  template: FIELD_TEMPLATE,
  styles: FIELD_STYLES,
  host: FIELD_HOST,
})
export class FieldFlow extends FieldBase {
  override readonly variant = flowField;
}
