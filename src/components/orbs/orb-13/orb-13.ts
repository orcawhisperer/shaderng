import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb13Orb } from "@/components/orbs/orb-13/meta";

export { meta, orb13Orb } from "@/components/orbs/orb-13/meta";

@Component({
  selector: "orb-13",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb13 extends OrbBase {
  override readonly variant = orb13Orb;
}
