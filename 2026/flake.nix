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
      windows = inputs.teleia.windows.build ./. "jam";
      nonnix = pkgs.stdenv.mkDerivation {
        name = "jam-nonnix";
        phases = [ "installPhase" ];
        installPhase = ''
          mkdir $out
          cp -rv ${jam}/bin/jam_server $out
          chmod +w $out/jam_server
          patchelf --remove-rpath $out/jam_server
          patchelf --set-interpreter /lib64/ld-linux-x86-64.so.2 $out/jam_server
          strip $out/jam_server
          chmod -w $out/jam_server
        '';
      };
    in {
      packages.${system} = {
        inherit jam windows nonnix;
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
