import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb04Orb } from "@/components/orbs/orb-04/meta";

export { meta, orb04Orb } from "@/components/orbs/orb-04/meta";

@Component({
  selector: "orb-04",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb04 extends OrbBase {
  override readonly variant = orb04Orb;
}
