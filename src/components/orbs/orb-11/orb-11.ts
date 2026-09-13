import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb11Orb } from "@/components/orbs/orb-11/meta";

export { meta, orb11Orb } from "@/components/orbs/orb-11/meta";

@Component({
  selector: "orb-11",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb11 extends OrbBase {
  override readonly variant = orb11Orb;
}
