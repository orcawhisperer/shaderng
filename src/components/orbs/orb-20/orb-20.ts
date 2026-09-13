import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb20Orb } from "@/components/orbs/orb-20/meta";

export { meta, orb20Orb } from "@/components/orbs/orb-20/meta";

@Component({
  selector: "orb-20",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb20 extends OrbBase {
  override readonly variant = orb20Orb;
}
