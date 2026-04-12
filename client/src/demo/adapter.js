import handleDemoRequest from "./handlers";

export default function demoAxiosAdapter(config) {
  return handleDemoRequest(config).then(
    (data) => ({
      data,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }),
    (err) => Promise.reject(err)
  );
}
