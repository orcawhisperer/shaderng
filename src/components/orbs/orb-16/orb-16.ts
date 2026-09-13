import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb16Orb } from "@/components/orbs/orb-16/meta";

export { meta, orb16Orb } from "@/components/orbs/orb-16/meta";

@Component({
  selector: "orb-16",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb16 extends OrbBase {
  override readonly variant = orb16Orb;
}
