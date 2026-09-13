import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb30Orb } from "@/components/orbs/orb-30/meta";

export { meta, orb30Orb } from "@/components/orbs/orb-30/meta";

@Component({
  selector: "orb-30",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb30 extends OrbBase {
  override readonly variant = orb30Orb;
}
