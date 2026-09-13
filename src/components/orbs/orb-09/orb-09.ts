import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb09Orb } from "@/components/orbs/orb-09/meta";

export { meta, orb09Orb } from "@/components/orbs/orb-09/meta";

@Component({
  selector: "orb-09",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb09 extends OrbBase {
  override readonly variant = orb09Orb;
}
