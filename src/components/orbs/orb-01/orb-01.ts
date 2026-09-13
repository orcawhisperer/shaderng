import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb01Orb } from "@/components/orbs/orb-01/meta";

export { meta, orb01Orb } from "@/components/orbs/orb-01/meta";

@Component({
  selector: "orb-01",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb01 extends OrbBase {
  override readonly variant = orb01Orb;
}
