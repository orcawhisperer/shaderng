import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb05Orb } from "@/components/orbs/orb-05/meta";

export { meta, orb05Orb } from "@/components/orbs/orb-05/meta";

@Component({
  selector: "orb-05",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb05 extends OrbBase {
  override readonly variant = orb05Orb;
}
