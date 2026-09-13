import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb24Orb } from "@/components/orbs/orb-24/meta";

export { meta, orb24Orb } from "@/components/orbs/orb-24/meta";

@Component({
  selector: "orb-24",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb24 extends OrbBase {
  override readonly variant = orb24Orb;
}
