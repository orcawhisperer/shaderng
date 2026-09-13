import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb07Orb } from "@/components/orbs/orb-07/meta";

export { meta, orb07Orb } from "@/components/orbs/orb-07/meta";

@Component({
  selector: "orb-07",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb07 extends OrbBase {
  override readonly variant = orb07Orb;
}
