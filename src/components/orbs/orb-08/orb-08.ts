import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb08Orb } from "@/components/orbs/orb-08/meta";

export { meta, orb08Orb } from "@/components/orbs/orb-08/meta";

@Component({
  selector: "orb-08",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb08 extends OrbBase {
  override readonly variant = orb08Orb;
}
