package com.orchestranetworks.ps.admin.devartifacts.rest;

import javax.ws.rs.*;

import com.orchestranetworks.rest.*;
import com.orchestranetworks.rest.annotation.*;

@ApplicationPath(value = "/rest/v1/ps/devartifacts")
@Documentation("Dev Artifacts REST Application")
public class DefaultDevArtifactsRESTApplication extends RESTApplicationAbstract
{
	public DefaultDevArtifactsRESTApplication()
	{
		super(
			(cfg) -> cfg.addPackages(DefaultDevArtifactsRESTApplication.class.getPackage())
				.register(ExportDevArtifactsPropertiesFileRESTService.class)
				.register(ImportDevArtifactsPropertiesFileRESTService.class));
	}
}
