import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb10Orb } from "@/components/orbs/orb-10/meta";

export { meta, orb10Orb } from "@/components/orbs/orb-10/meta";

@Component({
  selector: "orb-10",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb10 extends OrbBase {
  override readonly variant = orb10Orb;
}
