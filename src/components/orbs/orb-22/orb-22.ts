import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb22Orb } from "@/components/orbs/orb-22/meta";

export { meta, orb22Orb } from "@/components/orbs/orb-22/meta";

@Component({
  selector: "orb-22",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb22 extends OrbBase {
  override readonly variant = orb22Orb;
}
