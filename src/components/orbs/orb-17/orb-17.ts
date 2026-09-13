import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb17Orb } from "@/components/orbs/orb-17/meta";

export { meta, orb17Orb } from "@/components/orbs/orb-17/meta";

@Component({
  selector: "orb-17",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb17 extends OrbBase {
  override readonly variant = orb17Orb;
}
