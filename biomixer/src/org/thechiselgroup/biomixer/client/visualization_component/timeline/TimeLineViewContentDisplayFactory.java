/*******************************************************************************
 * Copyright 2009, 2010 Lars Grammel 
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at 
 *
 *    http://www.apache.org/licenses/LICENSE-2.0 
 *     
 * Unless required by applicable law or agreed to in writing, software 
 * distributed under the License is distributed on an "AS IS" BASIS, 
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
 * See the License for the specific language governing permissions and 
 * limitations under the License.  
 *******************************************************************************/
package org.thechiselgroup.biomixer.client.visualization_component.timeline;

import org.thechiselgroup.biomixer.client.DataTypeValidator;
import org.thechiselgroup.biomixer.client.core.error_handling.ErrorHandler;
import org.thechiselgroup.biomixer.client.core.resources.ResourceSet;
import org.thechiselgroup.biomixer.client.core.visualization.model.ViewContentDisplay;
import org.thechiselgroup.biomixer.client.core.visualization.model.initialization.ViewContentDisplayFactory;

public class TimeLineViewContentDisplayFactory implements
        ViewContentDisplayFactory {

    public final static String ID = TimeLineViewContentDisplayFactory.class
            .toString();

    @Override
    public ViewContentDisplay createViewContentDisplay(ErrorHandler errorHandler) {
        return new TimeLine(createDataTypeValidator());
    }

    @Override
    public String getViewContentTypeID() {
        return ID;
    }

    @Override
    public DataTypeValidator createDataTypeValidator() {
        return new DataTypeValidator() {
            @Override
            public boolean validateDataTypes(ResourceSet resourceSet) {
                return true;
            }
        };
    }
}