import { Component } from "@angular/core";

import {
  FIELD_HOST,
  FIELD_STYLES,
  FIELD_TEMPLATE,
  FieldBase,
} from "@/components/fields/field-base";
import { warpField } from "@/components/fields/warp/meta";
import { ShaderBackground } from "@/components/orbs/shader-background";

export { meta, warpField } from "@/components/fields/warp/meta";

/** `<field-warp>`: fills its positioned parent. Give the host a position and height to use it as a block. */
@Component({
  selector: "field-warp",
  imports: [ShaderBackground],
  template: FIELD_TEMPLATE,
  styles: FIELD_STYLES,
  host: FIELD_HOST,
})
export class FieldWarp extends FieldBase {
  override readonly variant = warpField;
}
