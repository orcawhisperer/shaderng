import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb02Orb } from "@/components/orbs/orb-02/meta";

export { meta, orb02Orb } from "@/components/orbs/orb-02/meta";

@Component({
  selector: "orb-02",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb02 extends OrbBase {
  override readonly variant = orb02Orb;
}
