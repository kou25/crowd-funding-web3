import React, { useContext, createContext } from "react";

import {
  useAddress,
  useContract,
  useMetamask,
  useContractWrite
} from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { SmartContract } from "@thirdweb-dev/sdk";

type Props = {
  address: string | undefined;
  contract: SmartContract<ethers.BaseContract> | undefined;
  connect: () => Promise<{
    data?: any | undefined;
    error?: Error | undefined;
  }>;
  createCampaign: (form: any) => Promise<void>;
  getCampaigns: () => Promise<any>;
  getUserCampaigns: () => Promise<any>;
  donate: (pId: any, amount: any) => Promise<any>;
  getDonations: (pId: any) => Promise<
    {
      donator: any;
      donation: string;
    }[]
  >;
};
const StateContext = createContext<Props | null>(null);

export const StateContextProvider = ({ children }: any) => {
  const { contract } = useContract(import.meta.env.VITE_THIRDWEB_ID as string);
  const { mutateAsync: createCampaign } = useContractWrite(
    contract,
    "createCampaign"
  );

  const address = useAddress();
  const connect = useMetamask();

  const publishCampaign = async (form: any) => {
    try {
      const data = await createCampaign([
        address, // owner
        form.title, // title
        form.description, // description
        form.target,
        new Date(form.deadline).getTime(), // deadline,
        form.image
      ]);

      console.log("contract call success", data);
    } catch (error) {
      console.log("contract call failure", error);
    }
  };

  const getCampaigns = async () => {
    const campaigns = await contract?.call("getCampaigns");

    const parsedCampaings = campaigns.map((campaign: any, i: number) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(
        campaign.amountCollected.toString()
      ),
      image: campaign.image,
      pId: i
    }));

    return parsedCampaings;
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();

    const filteredCampaigns = allCampaigns.filter(
      (campaign: any) => campaign.owner === address
    );

    return filteredCampaigns;
  };

  const donate = async (pId: any, amount: any) => {
    const data = await contract?.call("donateToCampaign", pId, {
      value: ethers.utils.parseEther(amount)
    });

    return data;
  };

  const getDonations = async (pId: any) => {
    const donations = await contract?.call("getDonars", pId);
    const numberOfDonations = donations[0].length;

    const parsedDonations = [];

    for (let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString())
      });
    }

    return parsedDonations;
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext) as Props;
