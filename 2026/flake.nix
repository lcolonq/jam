{
  inputs = {
    teleia.url = "github:lcolonq/teleia";
    nixpkgs.follows = "teleia/nixpkgs";
  };

  outputs = inputs@{ self, nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
      jam = inputs.teleia.native.build ./. "jam";
    in {
      packages.${system} = {
        inherit jam;
        default = jam;
      };
      applications.${system}.default = {
        type = "app";
        program = "${jam}/bin/jam_server";
      };
      devShells.${system}.default = inputs.teleia.shell.overrideAttrs (final: prev: {
        buildInputs = prev.buildInputs;
      });
    };
}
