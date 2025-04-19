{
  description = "A Node 22 Dev environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-24.11";
  };

  outputs = { self, nixpkgs, ... }: let
    system = "x86_64-linux";
  in {
    devShells."${system}".default = let
      pkgs = import nixpkgs {
        inherit system;
      };
    in pkgs.mkShell {
      # create an environment with nodejs_22 and pnpm
      packages = with pkgs; [
        nodejs_22
        nodePackages.pnpm
        aider-chat
      ];

      shellHook = ''
        echo "node: `${pkgs.nodejs_22}/bin/node --version`";
        echo "pnpm: `pnpm --version`";
        echo "Aider is ready to go."
      '';
    };
  };
}
