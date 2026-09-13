import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb06Orb } from "@/components/orbs/orb-06/meta";

export { meta, orb06Orb } from "@/components/orbs/orb-06/meta";

@Component({
  selector: "orb-06",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb06 extends OrbBase {
  override readonly variant = orb06Orb;
}
