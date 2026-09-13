import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb18Orb } from "@/components/orbs/orb-18/meta";

export { meta, orb18Orb } from "@/components/orbs/orb-18/meta";

@Component({
  selector: "orb-18",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb18 extends OrbBase {
  override readonly variant = orb18Orb;
}
