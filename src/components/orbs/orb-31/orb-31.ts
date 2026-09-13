import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb31Orb } from "@/components/orbs/orb-31/meta";

export { meta, orb31Orb } from "@/components/orbs/orb-31/meta";

@Component({
  selector: "orb-31",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb31 extends OrbBase {
  override readonly variant = orb31Orb;
}
