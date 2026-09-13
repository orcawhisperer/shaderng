import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb03Orb } from "@/components/orbs/orb-03/meta";

export { meta, orb03Orb } from "@/components/orbs/orb-03/meta";

@Component({
  selector: "orb-03",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb03 extends OrbBase {
  override readonly variant = orb03Orb;
}
