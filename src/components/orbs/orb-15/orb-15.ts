import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb15Orb } from "@/components/orbs/orb-15/meta";

export { meta, orb15Orb } from "@/components/orbs/orb-15/meta";

@Component({
  selector: "orb-15",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb15 extends OrbBase {
  override readonly variant = orb15Orb;
}
