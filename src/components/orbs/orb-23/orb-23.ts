import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb23Orb } from "@/components/orbs/orb-23/meta";

export { meta, orb23Orb } from "@/components/orbs/orb-23/meta";

@Component({
  selector: "orb-23",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb23 extends OrbBase {
  override readonly variant = orb23Orb;
}
